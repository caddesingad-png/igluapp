import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers, Plus, Lock, Globe, Pencil, Trash2, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { shareSet } from "@/lib/shareSet";

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

const Sets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sets, setSets] = useState<SetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await (supabase.from("sets" as any) as any)
        .select("id, name, occasion, photo_url, is_public, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const ids = (data as SetItem[]).map((s) => s.id);
        if (!ids.length) { setSets([]); setLoading(false); return; }

        // Fetch set_products with product photos
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
        setSets((data as SetItem[]).map((s) => ({
          ...s,
          product_count: countMap[s.id] ?? 0,
          product_photos: photosMap[s.id] ?? [],
        })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("sets" as any) as any).delete().eq("id", id);
    if (!error) setSets((prev) => prev.filter((s) => s.id !== id));
    else toast({ title: "Error deleting set", variant: "destructive" });
  };

  const handleShare = async (set: SetItem) => {
    if (!set.is_public) {
      // Make it public first
      await (supabase.from("sets" as any) as any)
        .update({ is_public: true })
        .eq("id", set.id);
      setSets((prev) => prev.map((s) => s.id === set.id ? { ...s, is_public: true } : s));
      set = { ...set, is_public: true };
    }
    await shareSet({ id: set.id, name: set.name, toast });
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">SETs</h1>
          <Button
            size="sm"
            className="rounded-full gap-1.5 text-xs h-8"
            onClick={() => navigate("/sets/new")}
          >
            <Plus className="w-3.5 h-3.5" />
            New set
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-accent/30 flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-accent-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No sets yet</h2>
          <p className="text-muted-foreground text-center text-sm max-w-[260px] mb-6">
            Create sets to organize your products into looks and routines
          </p>
          <Button className="rounded-full gap-2" onClick={() => navigate("/sets/new")}>
            <Plus className="w-4 h-4" /> Create your first set
          </Button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 pt-4 grid grid-cols-2 gap-3">
          {sets.map((set) => (
            <div
              key={set.id}
              className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/sets/${set.id}`)}
            >
              {/* Collage preview with name overlay */}
              <div className="relative flex gap-1 p-2 bg-muted/30">
                {/* Cover photo - square */}
                <div className="w-[52%] shrink-0">
                  {set.photo_url ? (
                    <img
                      src={set.photo_url}
                      alt={set.name}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-primary/10 flex items-center justify-center">
                      <Layers className="w-8 h-8 text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Product grid - 2x3 */}
                <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const photo = set.product_photos?.[i];
                    return photo ? (
                      <img
                        key={i}
                        src={photo}
                        alt=""
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ) : (
                      <div
                        key={i}
                        className="w-full aspect-square rounded-lg bg-muted"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Info row */}
              <div className="px-3 pt-2 pb-1">
                <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{set.name}</p>
                {set.occasion && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{set.occasion}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {set.product_count} produto{set.product_count !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end px-1 pb-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleShare(set)}>
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/sets/${set.id}/edit`)}>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deletar set?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removerá permanentemente <strong>{set.name}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(set.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
