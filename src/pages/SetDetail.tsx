import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { shareSet } from "@/lib/shareSet";
import { useToast } from "@/hooks/use-toast";

interface SetData {
  id: string;
  name: string;
  occasion: string | null;
  photo_url: string | null;
  is_public: boolean;
  user_id: string;
}

interface SetProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  photo_url: string | null;
}

const SetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [set, setSet] = useState<SetData | null>(null);
  const [products, setProducts] = useState<SetProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [setRes, prodRes] = await Promise.all([
        (supabase.from("sets" as any) as any).select("*").eq("id", id).single(),
        (supabase.from("set_products" as any) as any)
          .select("product_id, products(id, name, brand, category, photo_url)")
          .eq("set_id", id),
      ]);
      if (setRes.data) setSet(setRes.data);
      if (prodRes.data) {
        setProducts((prodRes.data as any[]).map((r) => r.products).filter(Boolean));
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleShare = async () => {
    if (!set) return;
    if (!set.is_public) {
      await (supabase.from("sets" as any) as any).update({ is_public: true }).eq("id", set.id);
      setSet((s) => s ? { ...s, is_public: true } : s);
    }
    await shareSet({ id: set.id, name: set.name, toast });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Set not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === set.user_id;

  return (
    <div className="min-h-screen pb-10 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sets")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {isOwner && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(`/sets/${set.id}/edit`)}>
                <Pencil className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Cover photo — square crop */}
        {set.photo_url && (
          <div className="flex justify-center px-4 pt-4">
            <img
              src={set.photo_url}
              alt={set.name}
              className="w-48 h-48 object-cover rounded-2xl shadow-sm"
            />
          </div>
        )}

        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            {set.is_public ? (
              <Globe className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">{set.is_public ? "Public set" : "Private set"}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{set.name}</h1>
          {set.occasion && <p className="text-muted-foreground mt-1">{set.occasion}</p>}
        </div>

        <div className="px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {products.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                onClick={() => isOwner && navigate(`/product/${p.id}`)}
              >
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.brand}</p>
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No products in this set yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetDetail;
