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
  Base: Layers,
  Batom: Heart,
  Sombra: Eye,
  Blush: Sparkles,
  Máscara: Wand2,
  Corretivo: FlaskConical,
  Iluminador: Sun,
  Contorno: Palette,
  Primer: Droplets,
  Fixador: Wind,
  Outro: Star,
  Foundation: Layers,
  Lipstick: Heart,
  Eyeshadow: Eye,
  Mascara: Wand2,
  Concealer: FlaskConical,
  Highlighter: Sun,
  Contour: Palette,
  "Setting Spray": Wind,
  Other: Star,
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

  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        className="surface-porcelain card-press flex items-center gap-3 p-3 cursor-pointer"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative shadow-soft-inset bg-muted/40">
          {product.photo_url ? (
            <ShimmerImage src={product.photo_url} alt={product.name} className="w-full h-full object-contain" shimmerClassName="rounded-2xl" width={56} height={56} responsive sizes="56px" />
          ) : (
            <Icon className="w-6 h-6 text-muted-foreground/50" strokeWidth={1.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body font-medium text-[10px] text-muted-foreground truncate uppercase tracking-[0.14em]">{product.brand}</p>
          <p className="font-display text-[15px] text-foreground truncate mt-0.5 leading-tight">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="font-body text-[10px] px-2.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground uppercase tracking-[0.1em]">
              {product.category}
            </span>
            {hasValidSwatch && (
              <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-soft-sm" style={{ backgroundColor: product.current_color! }} />
            )}
            {product.current_color && !hasValidSwatch && (
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[60px]">{product.current_color}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-display font-medium text-[15px] text-foreground font-tabular">
            R$ {product.purchase_price.toFixed(2).replace('.', ',')}
          </span>
          {product.is_favorite && <Heart className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="surface-porcelain card-press overflow-hidden cursor-pointer"
    >
      {product.photo_url ? (
        <div className="relative">
          <ShimmerImage src={product.photo_url} alt={product.name} className="w-full h-auto block" style={{ borderRadius: "20px 20px 0 0" }} responsive sizes="(max-width: 640px) 50vw, 200px" />
          {product.is_favorite && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full glass flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center relative bg-muted/30">
          <Icon className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.4} />
          {product.is_favorite && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full glass flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
            </div>
          )}
        </div>
      )}

      <div className="p-3">
        <p className="font-body font-medium text-[10px] text-muted-foreground truncate uppercase tracking-[0.14em]">{product.brand}</p>
        <p className="font-display text-[14px] text-foreground truncate mt-1 leading-tight">{product.name}</p>
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <span className="font-body text-[10px] px-2.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground uppercase tracking-[0.1em] truncate">
            {product.category}
          </span>
          <span className="font-display font-medium text-[14px] text-foreground font-tabular shrink-0">
            R$ {product.purchase_price.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {product.current_color && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/60">
            {hasValidSwatch ? (
              <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-soft-sm" style={{ backgroundColor: product.current_color }} />
            ) : null}
            <span className="text-[10px] font-mono text-muted-foreground truncate">{product.current_color}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
