import { useState, useRef } from "react";
import { Camera, Plus, Star, ThumbsUp, ThumbsDown, Loader2, Sparkles, Search, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { compressImage } from "@/lib/compressImage";

interface ReviewResult {
  summary: string;
  public_opinion: string;
  pros: string[];
  cons: string[];
  rating: number;
  comparison_verdict: string;
  recommendation: "vale_a_pena" | "ja_tem_similar" | "considere_alternativas";
  recommendation_text: string;
}

const RECOMMENDATION_CONFIG = {
  vale_a_pena: {
    label: "Vale a pena!",
    icon: ShieldCheck,
    className: "bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))] border-[hsl(var(--status-green))]/20",
  },
  ja_tem_similar: {
    label: "Você já tem similar",
    icon: AlertTriangle,
    className: "bg-[hsl(var(--status-yellow))]/10 text-[hsl(var(--status-yellow))] border-[hsl(var(--status-yellow))]/20",
  },
  considere_alternativas: {
    label: "Considere alternativas",
    icon: XCircle,
    className: "bg-[hsl(var(--status-red))]/10 text-[hsl(var(--status-red))] border-[hsl(var(--status-red))]/20",
  },
};

const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    stars.push(
      <Star
        key={i}
        className="w-5 h-5"
        fill={fill > 0 ? "hsl(var(--primary))" : "none"}
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        style={fill === 0.5 ? { clipPath: "inset(0 50% 0 0)" } : undefined}
      />
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      {stars}
      <span className="ml-2 font-body text-sm text-foreground font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

const ProductReview = () => {
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(compressed);

    // Auto-identify
    setIdentifying(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve((r.result as string).split(",")[1]);
        r.readAsDataURL(compressed);
      });

      const { data, error } = await supabase.functions.invoke("identify-product", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.name) setProductName(data.name);
      if (data?.brand) setProductBrand(data.brand);
      toast.success("Produto identificado pela foto! ✨");
    } catch {
      toast.error("Não foi possível identificar. Digite o nome manualmente.");
    } finally {
      setIdentifying(false);
    }
  };

  const handleReview = async () => {
    if (!productName.trim() || !user) return;
    setLoading(true);
    setReview(null);

    try {
      // Fetch user products for comparison
      const { data: products } = await (supabase.from("products" as any) as any)
        .select("name, brand, category, purchase_price")
        .eq("user_id", user.id);

      const userProducts = (products || []).map((p: any) => ({
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.purchase_price,
      }));

      const { data, error } = await supabase.functions.invoke("review-product", {
        body: {
          productName: productName.trim(),
          productBrand: productBrand.trim() || undefined,
          userProducts,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReview(data as ReviewResult);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao consultar review");
    } finally {
      setLoading(false);
    }
  };

  const recConfig = review ? RECOMMENDATION_CONFIG[review.recommendation] : null;

  return (
    <div className="min-h-screen bg-background screen-enter">
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="flex items-center max-w-lg mx-auto px-6 h-full">
          <img
            src={igluLogo}
            alt="IGLU"
            className="h-[22px]"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pt-6 pb-28">
        {/* Input Section */}
        <div className="space-y-4">
          <h1 className="font-heading text-xl font-semibold text-foreground">Consultar Produto</h1>
          <p className="font-body text-sm text-muted-foreground">
            Digite o nome do produto ou tire uma foto para receber uma review com opiniões públicas e comparação com seus produtos.
          </p>

          {/* Photo buttons */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
          <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

          {photoPreview ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              {identifying && (
                <div className="flex items-center gap-2 text-primary font-body text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Identificando produto…
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 h-16 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 transition-colors"
              >
                <Camera className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-body text-[11px] uppercase tracking-[0.08em]">Câmera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 h-16 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-body text-[11px] uppercase tracking-[0.08em]">Galeria</span>
              </button>
            </div>
          )}

          <div>
            <label className="label-overline block mb-2">Nome do Produto</label>
            <Input
              placeholder="e.g. Ruby Woo"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="label-overline block mb-2">Marca (opcional)</label>
            <Input
              placeholder="e.g. MAC Cosmetics"
              value={productBrand}
              onChange={(e) => setProductBrand(e.target.value)}
              maxLength={100}
            />
          </div>

          <Button
            onClick={handleReview}
            disabled={!productName.trim() || loading || identifying}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Consultando review…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Consultar Review
              </>
            )}
          </Button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Result */}
        {review && !loading && (
          <div className="mt-8 space-y-4 animate-fade-in">
            {/* Rating + Recommendation */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <StarRating rating={review.rating} />
                {recConfig && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-body font-medium ${recConfig.className}`}>
                    <recConfig.icon className="w-3.5 h-3.5" />
                    {recConfig.label}
                  </div>
                )}
              </div>
              <p className="font-body text-sm text-foreground">{review.recommendation_text}</p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="label-overline mb-2">Sobre o Produto</h3>
              <p className="font-body text-sm text-foreground leading-relaxed">{review.summary}</p>
            </div>

            {/* Public Opinion */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="label-overline mb-2">O que dizem na internet</h3>
              <p className="font-body text-sm text-foreground leading-relaxed">{review.public_opinion}</p>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <ThumbsUp className="w-4 h-4 text-[hsl(var(--status-green))]" />
                  <span className="label-overline">Prós</span>
                </div>
                <ul className="space-y-2">
                  {review.pros.map((pro, i) => (
                    <li key={i} className="font-body text-xs text-foreground leading-relaxed flex gap-1.5">
                      <span className="text-[hsl(var(--status-green))] mt-0.5 flex-shrink-0">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <ThumbsDown className="w-4 h-4 text-[hsl(var(--status-red))]" />
                  <span className="label-overline">Contras</span>
                </div>
                <ul className="space-y-2">
                  {review.cons.map((con, i) => (
                    <li key={i} className="font-body text-xs text-foreground leading-relaxed flex gap-1.5">
                      <span className="text-[hsl(var(--status-red))] mt-0.5 flex-shrink-0">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Comparison */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="label-overline mb-2">Comparação com seus produtos</h3>
              <p className="font-body text-sm text-foreground leading-relaxed">{review.comparison_verdict}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReview;
