import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Heart, Pencil, Trash2, Calendar, DollarSign,
  Clock, Repeat, Weight, Palette, StickyNote, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sparkles, FlaskConical, Eye, Wind, Wand2, Layers, Sun, Droplets, Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  weight_grams: number | null;
  purchase_date: string;
  pao_months: number;
  usage_frequency: string;
  notes: string | null;
  photo_url: string | null;
  color_codes: string[] | null;
  is_favorite: boolean;
  created_at: string;
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data, error } = await (supabase.from("products" as any) as any)
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) setProduct(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const toggleFavorite = async () => {
    if (!product) return;
    setFavoriteLoading(true);
    const { error } = await (supabase.from("products" as any) as any)
      .update({ is_favorite: !product.is_favorite })
      .eq("id", product.id);
    if (!error) {
      setProduct((p) => p ? { ...p, is_favorite: !p.is_favorite } : p);
    }
    setFavoriteLoading(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    const { error } = await (supabase.from("products" as any) as any)
      .delete()
      .eq("id", product.id);
    if (error) {
      toast({ title: "Error", description: "Could not delete product.", variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      navigate("/library");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const Icon = categoryIcons[product.category] ?? Star;

  const InfoRow = ({
    icon: RowIcon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <RowIcon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-8 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/library")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              disabled={favoriteLoading}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  product.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"
                }`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/edit-product/${product.id}`)}>
              <Pencil className="w-5 h-5 text-muted-foreground" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove <strong>{product.name}</strong> from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Photo / Hero */}
        <div className="w-full aspect-square rounded-2xl bg-muted overflow-hidden flex items-center justify-center mb-5">
          {product.photo_url ? (
            <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-20 h-20 text-muted-foreground/20" />
          )}
        </div>

        {/* Title block */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {product.category}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground">{product.brand}</p>
        </div>

        {/* Color swatches */}
        {product.color_codes && product.color_codes.length > 0 && (
          <div className="flex items-center gap-2 mb-5">
            {product.color_codes.map((code, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: code }}
                  title={code}
                />
                <span className="text-xs text-muted-foreground font-mono">{code}</span>
              </div>
            ))}
          </div>
        )}

        {/* Details card */}
        <div className="rounded-xl border border-border bg-card px-4 mb-4">
          <InfoRow icon={DollarSign} label="Purchase Price" value={`$${product.purchase_price.toFixed(2)}`} />
          <InfoRow icon={Calendar} label="Purchase Date" value={new Date(product.purchase_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          <InfoRow icon={Clock} label="PAO (Period After Opening)" value={`${product.pao_months} months`} />
          <InfoRow icon={Repeat} label="Usage Frequency" value={product.usage_frequency} />
          {product.weight_grams != null && (
            <InfoRow icon={Weight} label="Weight" value={`${product.weight_grams}g`} />
          )}
        </div>

        {/* Notes */}
        {product.notes && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{product.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
