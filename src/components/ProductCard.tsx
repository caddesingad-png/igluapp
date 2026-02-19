import {
  Sparkles, FlaskConical, Eye, Wind, Wand2,
  Layers, Sun, Droplets, Star, Heart, Palette
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  photo_url: string | null;
  is_favorite?: boolean;
  current_color?: string | null; // hex or named color for current shade
}

const categoryIcons: Record<string, React.ElementType> = {
  Foundation: Layers,
  Lipstick: Heart,
  Eyeshadow: Eye,
  Blush: Sparkles,
  Mascara: Wand2,
  Concealer: FlaskConical,
  Highlighter: Sun,
  Contour: Palette,
  Primer: Droplets,
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
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md cursor-pointer active:scale-[0.99]"
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {product.photo_url ? (
            <img
              src={product.photo_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
          <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {product.category}
            </span>
            {hasValidSwatch && (
              <div
                className="w-3.5 h-3.5 rounded-full border border-border shadow-sm shrink-0"
                style={{ backgroundColor: product.current_color! }}
                title={`Current shade: ${product.current_color}`}
              />
            )}
            {product.current_color && !hasValidSwatch && (
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[60px]">
                {product.current_color}
              </span>
            )}
          </div>
        </div>

        {/* Price + Fav */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-semibold text-foreground">
            ${product.purchase_price.toFixed(2)}
          </span>
          {product.is_favorite && (
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
          )}
        </div>
      </div>
    );
  }

  // Grid
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md cursor-pointer active:scale-[0.98]"
    >
      {/* Photo */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="w-10 h-10 text-muted-foreground/30" />
        )}
        {product.is_favorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-4 h-4 text-primary fill-primary drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {product.category}
          </span>
          <span className="text-xs font-semibold text-foreground">
            ${product.purchase_price.toFixed(2)}
          </span>
        </div>

        {/* Current color swatch row */}
        {product.current_color && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
            {hasValidSwatch ? (
              <div
                className="w-4 h-4 rounded-full border border-border shadow-sm shrink-0"
                style={{ backgroundColor: product.current_color }}
              />
            ) : null}
            <span className="text-[10px] font-mono text-muted-foreground truncate">
              {product.current_color}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
