import { Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  photo_url: string | null;
}

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Photo */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Sparkles className="w-8 h-8 text-muted-foreground/40" />
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
      </div>
    </div>
  );
};

export default ProductCard;
