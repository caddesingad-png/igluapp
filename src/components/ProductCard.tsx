import {
  Sparkles, FlaskConical, Eye, Wind, Wand2,
  Layers, Sun, Droplets, Star, Heart, Palette
} from "lucide-react";
import ShimmerImage from "@/components/ShimmerImage";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  photo_url: string | null;
  is_favorite?: boolean;
  current_color?: string | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  Base: Layers, Batom: Heart, Sombra: Eye, Blush: Sparkles, Máscara: Wand2,
  Corretivo: FlaskConical, Iluminador: Sun, Contorno: Palette, Primer: Droplets,
  Fixador: Wind, Outro: Star, Foundation: Layers, Lipstick: Heart, Eyeshadow: Eye,
  Mascara: Wand2, Concealer: FlaskConical, Highlighter: Sun, Contour: Palette,
  "Setting Spray": Wind, Other: Star,
};

const isValidColor = (c: string) => {
  if (!c) return false;
  const s = new Option().style;
  s.color = c;
  return s.color !== "";
};

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  onClick?: () => void;
}

const ProductCard = ({ product, viewMode = "grid", onClick }: ProductCardProps) => {
  const Icon = categoryIcons[product.category] ?? Star;
  const hasValidSwatch = product.current_color && isValidColor(product.current_color);
  const formattedPrice = `R$ ${product.purchase_price.toFixed(2).replace('.', ',')}`;

  if (viewMode === "list") {
    return (
      <div onClick={onClick} className="surface-porcelain card-press flex items-center gap-3 p-3 cursor-pointer">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative"
          style={{ background: "hsl(28 24% 90%)", boxShadow: "var(--shadow-soft-inset)" }}
        >
          {product.photo_url ? (
            <ShimmerImage src={product.photo_url} alt={product.name} className="w-full h-full object-contain" shimmerClassName="rounded-2xl" width={56} height={56} responsive sizes="56px" />
          ) : (
            <Icon className="w-6 h-6" style={{ color: "hsl(18 11% 57% / 0.6)" }} strokeWidth={1.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="t-brand truncate">{product.brand}</p>
          <p className="t-card-title truncate mt-0.5 leading-tight">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="px-2.5 py-0.5 rounded-full truncate"
              style={{
                fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
                background: "hsl(28 24% 90%)", color: "hsl(18 11% 57%)",
                boxShadow: "var(--shadow-soft-inset)",
              }}
            >
              {product.category}
            </span>
            {hasValidSwatch && (
              <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-soft-sm" style={{ backgroundColor: product.current_color! }} />
            )}
            {product.current_color && !hasValidSwatch && (
              <span className="text-[10px] font-mono truncate max-w-[60px]" style={{ color: "hsl(18 11% 57%)" }}>{product.current_color}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="t-price font-tabular">{formattedPrice}</span>
          {product.is_favorite && <Heart className="w-3.5 h-3.5 fill-current" style={{ color: "hsl(33 41% 60%)" }} />}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="surface-porcelain card-press overflow-hidden cursor-pointer">
      {product.photo_url ? (
        <div className="relative" style={{ borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
          <ShimmerImage src={product.photo_url} alt={product.name} className="w-full h-auto block" responsive sizes="(max-width: 640px) 50vw, 200px" />
          {/* warm overlay gradient at bottom of image */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{ background: "linear-gradient(to top, hsl(28 27% 95% / 0.55), transparent)" }}
            aria-hidden
          />
          {product.is_favorite && (
            <div
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(22 56% 98% / 0.8)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid hsl(0 0% 100% / 0.6)",
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-current" style={{ color: "hsl(33 41% 60%)" }} />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center relative" style={{ background: "hsl(28 24% 90% / 0.6)" }}>
          <Icon className="w-10 h-10" style={{ color: "hsl(18 11% 57% / 0.35)" }} strokeWidth={1.4} />
          {product.is_favorite && (
            <div
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(22 56% 98% / 0.8)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid hsl(0 0% 100% / 0.6)",
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-current" style={{ color: "hsl(33 41% 60%)" }} />
            </div>
          )}
        </div>
      )}

      <div className="p-3.5">
        <p className="t-brand truncate">{product.brand}</p>
        <p className="t-card-title truncate mt-1 leading-tight">{product.name}</p>
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full truncate"
            style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
              background: "hsl(28 24% 90%)", color: "hsl(18 11% 57%)",
              boxShadow: "var(--shadow-soft-inset)",
            }}
          >
            {product.category}
          </span>
          <span className="t-price font-tabular shrink-0">{formattedPrice}</span>
        </div>

        {product.current_color && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5" style={{ borderTop: "1px solid hsl(28 20% 86% / 0.6)" }}>
            {hasValidSwatch ? (
              <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-soft-sm" style={{ backgroundColor: product.current_color }} />
            ) : null}
            <span className="text-[11px] font-mono truncate" style={{ color: "hsl(18 11% 57%)" }}>{product.current_color}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
