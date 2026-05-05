import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Globe, Share2 } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";
import ShimmerImage from "@/components/ShimmerImage";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { shareSet } from "@/lib/shareSet";
import { useToast } from "@/hooks/use-toast";

interface SetData {
  id: string;
  name: string;
  occasion: string | null;
  photo_url: string | null;
}

interface SetProduct {
  id: string;
  name: string;
  brand: string;
  photo_url: string | null;
}

// Update <head> meta tags dynamically for OG preview
const setOgMeta = (title: string, description: string, image?: string | null) => {
  const setMeta = (prop: string, content: string) => {
    let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", prop);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };
  const setNameMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  document.title = title;
  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:type", "article");
  setMeta("og:url", window.location.href);
  if (image) {
    setMeta("og:image", image);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "630");
    setNameMeta("twitter:image", image);
  }
  setNameMeta("twitter:card", "summary_large_image");
  setNameMeta("twitter:title", title);
  setNameMeta("twitter:description", description);
};

const PublicSetView = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [set, setSet] = useState<SetData | null>(null);
  const [products, setProducts] = useState<SetProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [setRes, prodRes] = await Promise.all([
        (supabase.from("sets" as any) as any)
          .select("id, name, occasion, photo_url")
          .eq("id", id)
          .eq("is_public", true)
          .single(),
        (supabase.from("set_products" as any) as any)
          .select("product_id, products(id, name, brand, photo_url)")
          .eq("set_id", id),
      ]);

      if (setRes.error || !setRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const setData: SetData = setRes.data;
      setSet(setData);
      setProducts(
        ((prodRes.data ?? []) as any[]).map((r) => r.products).filter(Boolean)
      );

      // Update OG meta for social sharing
      const ogDescription = setData.occasion
        ? `${setData.occasion} · ${(prodRes.data ?? []).length} products`
        : `${(prodRes.data ?? []).length} products`;
      setOgMeta(`${setData.name} — IGLU`, ogDescription, setData.photo_url);

      setLoading(false);
    };
    load();
  }, [id]);

  const handleShare = () => {
    if (!set) return;
    shareSet({ id: set.id, name: set.name, toast });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <Globe className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Set not found</h1>
        <p className="text-muted-foreground text-sm">
          This set is private or doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Brand header */}
      <div className="w-full flex justify-center py-3 border-b border-border bg-background">
        <img
          src={igluLogo}
          alt="IGLU"
          className="h-[20px]"
          style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
        />
      </div>

      {/* Cover photo */}
      {set?.photo_url && (
        <div className="w-full h-64 overflow-hidden">
          <div className="w-full h-full overflow-hidden relative">
            <ShimmerImage src={set.photo_url} alt={set?.name ?? ""} className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">Set público</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{set?.name}</h1>
          {set?.occasion && (
            <p className="text-muted-foreground mt-1">{set.occasion}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5 shrink-0 mt-1" onClick={handleShare}>
          <Share2 className="w-3.5 h-3.5" />
          Compartilhar
        </Button>
      </div>

      {/* Products */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {products.length} produto{products.length !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              {p.photo_url ? (
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 relative">
                  <ShimmerImage src={p.photo_url} alt={p.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-lg bg-muted shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.brand}</p>
              </div>
            </div>
          ))}
        </div>

        {/* IGLU branding footer */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Criado com</p>
          <img
            src={igluLogo}
            alt="IGLU"
            className="h-[18px]"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Organize sua coleção de beleza, monte looks e compartilhe.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicSetView;
