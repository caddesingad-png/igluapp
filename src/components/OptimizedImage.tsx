import { useState, useRef, useEffect } from "react";
import { getOptimizedImageUrl } from "@/lib/optimizedImage";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  width?: number;
  quality?: number;
  /** Show a shimmer placeholder while loading */
  shimmer?: boolean;
}

/**
 * Lazy-loaded image with Supabase transform optimization and
 * optional shimmer placeholder. Uses native IntersectionObserver
 * for viewport-based lazy loading.
 */
const OptimizedImage = ({
  src,
  width = 400,
  quality = 75,
  shimmer = true,
  className = "",
  alt = "",
  style,
  ...rest
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const optimizedSrc = getOptimizedImageUrl(src, { width, quality });

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Shimmer placeholder */}
      {shimmer && !loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {inView && optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          {...rest}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
