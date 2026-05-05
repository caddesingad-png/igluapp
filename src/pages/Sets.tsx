import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import igluLogo from "@/assets/iglu-logo.svg";
import ShimmerImage from "@/components/ShimmerImage";
import { SkeletonSetCard } from "@/components/SkeletonCard";
import {
  Layers, Plus, Pencil, Trash2, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCached, setCache } from "@/lib/apiCache";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { shareSet } from "@/lib/shareSet";
import DiscoverFeed from "@/components/DiscoverFeed";

interface SetItem {
  id: string;
  name: string;
  occasion: string | null;
  photo_url: string | null;
  is_public: boolean;
  created_at: string;
  product_count?: number;
  product_photos?: (string | null)[];
}

type Tab = "my" | "discover";

const Sets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sets, setSets] = useState<SetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("my");

  useEffect(() => {
    if (!user) return;
    const cacheKey = `sets:${user.id}`;
    const cached = getCached<SetItem[]>(cacheKey);
    if (cached) {
      setSets(cached);
      setLoading(false);
    }
    const load = async () => {
      const { data, error } = await (supabase.from("sets" as any) as any)
        .select("id, name, occasion, photo_url, is_public, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const ids = (data as SetItem[]).map((s) => s.id);
        if (!ids.length) { setSets([]); setLoading(false); setCache(cacheKey, []); return; }

        const { data: setProducts } = await (supabase.from("set_products" as any) as any)
          .select("set_id, products(photo_url)")
          .in("set_id", ids);

        const countMap: Record<string, number> = {};
        const photosMap: Record<string, (string | null)[]> = {};
        for (const r of setProducts ?? []) {
          countMap[r.set_id] = (countMap[r.set_id] ?? 0) + 1;
          if (!photosMap[r.set_id]) photosMap[r.set_id] = [];
          if (photosMap[r.set_id].length < 6) {
            photosMap[r.set_id].push(r.products?.photo_url ?? null);
          }
        }
        const result = (data as SetItem[]).map((s) => ({
          ...s,
          product_count: countMap[s.id] ?? 0,
          product_photos: photosMap[s.id] ?? [],
        }));
        setSets(result);
        setCache(cacheKey, result);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    // Optimistic: remove immediately
    const prev = sets;
    setSets((s) => s.filter((x) => x.id !== id));
    const { error } = await (supabase.from("sets" as any) as any).delete().eq("id", id);
    if (error) {
      setSets(prev); // rollback
      toast({ title: "Erro ao deletar set", variant: "destructive" });
    }
  };

  const handleShare = async (set: SetItem) => {
    if (!set.is_public) {
      await (supabase.from("sets" as any) as any).update({ is_public: true }).eq("id", set.id);
      setSets((prev) => prev.map((s) => s.id === set.id ? { ...s, is_public: true } : s));
      set = { ...set, is_public: true };
    }
    await shareSet({ id: set.id, name: set.name, toast });
  };

  return (
    <div className="min-h-screen pb-20 bg-background screen-enter">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "auto" }}>
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src={igluLogo}
            alt="IGLU"
            className="h-[22px]"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
          {tab === "my" && (
            <button
              onClick={() => navigate("/sets/new")}
              className="w-8 h-8 flex items-center justify-center text-foreground"
            >
              <Plus className="w-[20px] h-[20px]" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="max-w-lg mx-auto px-6 pb-3 flex gap-1 bg-muted/40 mx-6 rounded-md p-1" style={{ margin: "0 24px 12px" }}>
          <button
            onClick={() => setTab("my")}
            className={`flex-1 py-2 rounded-sm font-body text-[12px] font-medium transition-colors ${
              tab === "my" ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Meus SETs
          </button>
          <button
            onClick={() => setTab("discover")}
            className={`flex-1 py-2 rounded-sm font-body text-[12px] font-medium transition-colors ${
              tab === "discover" ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Descobrir
          </button>
        </div>
      </header>

      {tab === "discover" ? (
        <DiscoverFeed />
      ) : loading ? (
        <div className="max-w-lg mx-auto px-6 pt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonSetCard key={i} />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in text-center">
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-6">
            <Layers className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <h2 className="font-display text-[20px] font-normal text-foreground mb-3">Nenhum set ainda</h2>
          <p className="font-body font-light text-[14px] text-muted-foreground leading-relaxed max-w-[240px] mb-6">
            Crie sets para organizar seus produtos em looks e rotinas
          </p>
          <Button className="gap-2" onClick={() => navigate("/sets/new")}>
            <Plus className="w-4 h-4" /> Criar primeiro set
          </Button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-6 pt-4 grid grid-cols-2 gap-3">
          {sets.map((set) => (
            <div
              key={set.id}
              className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer"
              style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
              onClick={() => navigate(`/sets/${set.id}`)}
            >
              {/* Collage preview */}
              <div className="relative flex gap-1 p-1.5 bg-muted/20">
                <div className="w-[52%] shrink-0">
                  {set.photo_url ? (
                    <div className="w-full aspect-square rounded-[8px] overflow-hidden relative">
                      <ShimmerImage src={set.photo_url} alt={set.name} className="w-full h-full object-contain" width={120} height={120} responsive sizes="120px" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square rounded-[8px] bg-muted flex items-center justify-center">
                      <Layers className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-0.5">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const photo = set.product_photos?.[i];
                    return photo ? (
                      <div key={i} className="w-full aspect-square rounded-sm overflow-hidden relative">
                        <ShimmerImage src={photo} alt="" className="w-full h-full object-cover" width={32} height={32} />
                      </div>
                    ) : (
                      <div key={i} className="w-full aspect-square rounded-sm bg-muted" />
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="px-3 pt-2 pb-1">
                <p className="font-body font-medium text-[13px] text-foreground leading-tight line-clamp-1">{set.name}</p>
                {set.occasion && (
                  <p className="font-body font-light text-[11px] text-muted-foreground truncate mt-0.5">{set.occasion}</p>
                )}
                <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                  {set.product_count} produto{set.product_count !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end px-1 pb-1" onClick={(e) => e.stopPropagation()}>
                <button className="h-7 w-7 flex items-center justify-center text-muted-foreground" onClick={() => handleShare(set)}>
                  <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button className="h-7 w-7 flex items-center justify-center text-muted-foreground" onClick={() => navigate(`/sets/${set.id}/edit`)}>
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="h-7 w-7 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" strokeWidth={1.5} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[20px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display text-[18px] font-normal">Deletar set?</AlertDialogTitle>
                      <AlertDialogDescription className="font-body font-light text-[14px]">
                        Isso removerá permanentemente <strong>{set.name}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(set.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                      >
                        Deletar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sets;
