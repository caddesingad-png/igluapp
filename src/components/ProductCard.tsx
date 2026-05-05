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
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 cursor-pointer card-press"
        style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
      >
        <div className="w-14 h-14 rounded-[10px] bg-muted flex items-center justify-center overflow-hidden shrink-0 relative">
          {product.photo_url ? (
            <ShimmerImage src={product.photo_url} alt={product.name} className="w-full h-full object-contain" shimmerClassName="rounded-[10px]" width={56} height={56} responsive sizes="56px" />
          ) : (
            <Icon className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body font-300 text-[11px] text-muted-foreground truncate uppercase tracking-[0.08em]">{product.brand}</p>
          <p className="font-body font-medium text-[13px] text-foreground truncate mt-0.5">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-body text-[10px] px-2 py-0.5 rounded-sm bg-muted text-muted-foreground uppercase tracking-[0.1em]">
              {product.category}
            </span>
            {hasValidSwatch && (
              <div className="w-3 h-3 rounded-full border border-border shrink-0" style={{ backgroundColor: product.current_color! }} />
            )}
            {product.current_color && !hasValidSwatch && (
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[60px]">{product.current_color}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-body font-medium text-[15px] text-foreground">
            R$ {product.purchase_price.toFixed(2).replace('.', ',')}
          </span>
          {product.is_favorite && <Heart className="w-3.5 h-3.5 text-primary fill-primary" />}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer card-press"
      style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
    >
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
        {product.photo_url ? (
          <ShimmerImage src={product.photo_url} alt={product.name} className="w-full h-full object-contain" style={{ borderRadius: "10px 10px 0 0" }} width={200} height={200} responsive sizes="(max-width: 640px) 50vw, 200px" />
        ) : (
          <Icon className="w-10 h-10 text-muted-foreground/20" />
        )}
        {product.is_favorite && (
          <div className="absolute bottom-2 right-2">
            <Heart className="w-4 h-4 text-primary fill-primary drop-shadow-sm" />
          </div>
        )}
      </div>

      <div className="p-[10px]">
        <p className="font-body font-light text-[11px] text-muted-foreground truncate uppercase tracking-[0.08em]">{product.brand}</p>
        <p className="font-body font-medium text-[13px] text-foreground truncate mt-[3px]">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-body text-[10px] px-2 py-0.5 rounded-sm bg-muted text-muted-foreground uppercase tracking-[0.1em]">
            {product.category}
          </span>
          <span className="font-body font-medium text-[15px] text-foreground">
            R$ {product.purchase_price.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {product.current_color && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
            {hasValidSwatch ? (
              <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" style={{ backgroundColor: product.current_color }} />
            ) : null}
            <span className="text-[10px] font-mono text-muted-foreground truncate">{product.current_color}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
