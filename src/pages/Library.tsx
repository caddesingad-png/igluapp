import { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  photo_url: string | null;
  color_codes: string[];
  pao_months: number;
  purchase_date: string;
  usage_frequency: string;
}

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      const { data, error } = await (supabase.from("products" as any) as any)
        .select("id, name, brand, category, purchase_price, photo_url, color_codes, pao_months, purchase_date, usage_frequency")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  const isEmpty = !loading && products.length === 0;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Library</h1>
          <Button
            size="sm"
            onClick={() => navigate("/add-product")}
            className="rounded-full gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Your collection is empty</h2>
          <p className="text-muted-foreground text-center text-sm max-w-[260px] mb-8">
            Start building your beauty library by adding your first product
          </p>
          <Button
            onClick={() => navigate("/add-product")}
            className="rounded-full px-8 h-12 text-base font-semibold gap-2"
          >
            <Plus className="w-5 h-5" />
            Add your first product
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {!isEmpty && !loading && (
        <div className="max-w-lg mx-auto px-4 pt-4 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-3">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
